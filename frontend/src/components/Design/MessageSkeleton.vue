<template>
    <div class="space-y-8 animate-pulse">
        <div v-for="n in 3" :key="n" class="flex" :class="n % 3 === 0 ? 'justify-end' : 'gap-3 items-end'">
            <!-- Avatar Skeleton (received) -->
            <div v-if="n % 3 !== 0" class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />

            <!-- Bubble Skeleton -->
            <div class="max-w-[75%]">
                <div class="relative px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700">
                    <div class="absolute bottom-0 w-4 h-4 bg-gray-200 dark:bg-gray-700"
                        :class="n % 3 === 0 ? 'right-0 translate-x-2' : 'left-0 -translate-x-2'" />

                    <div class="space-y-2">
                        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
                        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
                    </div>

                    <div class="flex justify-end mt-2">
                        <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
